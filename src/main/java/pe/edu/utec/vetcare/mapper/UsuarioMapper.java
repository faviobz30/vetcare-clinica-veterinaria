package pe.edu.utec.vetcare.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import pe.edu.utec.vetcare.dto.request.CreateUsuarioRequest;
import pe.edu.utec.vetcare.dto.request.UpdateUsuarioRequest;
import pe.edu.utec.vetcare.dto.response.UsuarioResponse;
import pe.edu.utec.vetcare.entity.UsuarioEntity;

@Mapper(componentModel = "spring")
public interface UsuarioMapper {

    @Mapping(target = "idUsuario", ignore = true)
    @Mapping(target = "rol", ignore = true)
    @Mapping(target = "fechaRegistro", ignore = true)
    UsuarioEntity toEntity(CreateUsuarioRequest request);

    @Mapping(source = "rol.idRol", target = "idRol")
    @Mapping(source = "rol.nombre", target = "rol")
    UsuarioResponse toResponse(UsuarioEntity entity);

    @Mapping(target = "idUsuario", ignore = true)
    @Mapping(target = "rol", ignore = true)
    @Mapping(target = "fechaRegistro", ignore = true)
    @Mapping(target = "contrasena", ignore = true)
    void updateEntity(
            UpdateUsuarioRequest request,
            @MappingTarget UsuarioEntity entity
    );
}