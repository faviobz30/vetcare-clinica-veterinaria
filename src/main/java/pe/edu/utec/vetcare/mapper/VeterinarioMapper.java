package pe.edu.utec.vetcare.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import pe.edu.utec.vetcare.dto.request.CreateVeterinarioRequest;
import pe.edu.utec.vetcare.dto.request.UpdateVeterinarioRequest;
import pe.edu.utec.vetcare.dto.response.VeterinarioResponse;
import pe.edu.utec.vetcare.entity.VeterinarioEntity;

@Mapper(componentModel = "spring")
public interface VeterinarioMapper {

    @Mapping(target = "idVeterinario", ignore = true)
    VeterinarioEntity toEntity(CreateVeterinarioRequest request);

    VeterinarioResponse toResponse(VeterinarioEntity entity);

    @Mapping(target = "idVeterinario", ignore = true)
    @Mapping(target = "idUsuario", ignore = true)
    void updateEntity(
            UpdateVeterinarioRequest request,
            @MappingTarget VeterinarioEntity entity
    );
}