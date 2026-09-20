package pe.edu.utec.vetcare.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import pe.edu.utec.vetcare.dto.request.UsuarioRequest;
import pe.edu.utec.vetcare.dto.response.UsuarioResponse;
import pe.edu.utec.vetcare.entity.UsuarioEntity;

@Mapper(componentModel = "spring")
public interface UsuarioMapper {

    @Mapping(target = "idUsuario", ignore = true)
    @Mapping(target = "rol", ignore = true)
    @Mapping(target = "fechaRegistro", ignore = true)
    UsuarioEntity toEntity(UsuarioRequest request);

    @Mapping(
            source = "rol.idRol",
            target = "idRol"
    )
    @Mapping(
            source = "rol.nombre",
            target = "rol"
    )
    UsuarioResponse toResponse(UsuarioEntity entity);

    @Mapping(target = "idUsuario", ignore = true)
    @Mapping(target = "rol", ignore = true)
    @Mapping(target = "fechaRegistro", ignore = true)
    void updateEntity(
            UsuarioRequest request,
            @MappingTarget UsuarioEntity entity
    );
}